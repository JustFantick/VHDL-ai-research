library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

entity inefficient_example is
    Port ( clk : in STD_LOGIC;
           data_in : in STD_LOGIC_VECTOR(15 downto 0);
           result : out STD_LOGIC_VECTOR(15 downto 0)
         );
end inefficient_example;

architecture Behavioral of inefficient_example is
begin
    process(clk)
    begin
        if rising_edge(clk) then
            -- Inefficient: Using multiple if-else instead of case statement
            if data_in(3 downto 0) = "0000" then
                result <= data_in;
            elsif data_in(3 downto 0) = "0001" then
                result <= data_in(14 downto 0) & '0';
            elsif data_in(3 downto 0) = "0010" then
                result <= data_in(13 downto 0) & "00";
            elsif data_in(3 downto 0) = "0011" then
                result <= data_in(12 downto 0) & "000";
            elsif data_in(3 downto 0) = "0100" then
                result <= data_in(11 downto 0) & "0000";
            else
                result <= (others => '0');
            end if;
        end if;
    end process;
end Behavioral;
