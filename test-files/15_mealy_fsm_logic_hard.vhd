library ieee;
use ieee.std_logic_1164.all;

entity mealy_fsm is
    port(
        x1, x2, x3, x4, nStart, Clock : in std_logic;
        y1, y2, y3 : out std_logic
    );
end mealy_fsm;

architecture behavioral of mealy_fsm is
    signal D, Q : std_logic_vector(1 downto 0);
    signal a0, a1, a2, a3 : std_logic;
begin
    process(Clock, nStart)
    begin
        if nStart = '0' then
            Q <= "00";
        elsif rising_edge(Clock) then
            Q <= D;
        end if;
    end process;

    process(Q)
    begin
        a0 <= '0';
        a1 <= '0';
        a2 <= '0';
        a3 <= '0';
        case Q is
            when "00" => a0 <= '1';
            when "01" => a1 <= '1';
            when "10" => a2 <= '1';
            when "11" => a3 <= '1';
            when others => report "Error in Q" severity ERROR;
        end case;
    end process;

    process(x1, x2, x3, x4, a0, a1, a2, a3, nStart, Q)
    begin
        D(0) <= not((a1 and x1) or (a3 and x4)) or Q(0);
        D(1) <= (a1 and x1) or (a2 and x2 and x3) or Q(1);
        if nStart = '0' then
            y1 <= '0';
            y2 <= '0';
            y3 <= '0';
        else
            y1 <= not((a1 and x1) or (a3 and x4));
            y2 <= not((a2 and x2 and x3) or (a3 and x4));
            y3 <= not(a3 and x4);
            y1 <= (a1 and x1) or (a2 and x2 and x3);
            y3 <= (a1 and x1) or (a2 and x2 and x3);
        end if;
    end process;
end behavioral;